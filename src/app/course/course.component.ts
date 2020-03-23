import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  ViewChild
} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { fromEvent, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { Course } from '../model/course';
import { CoursesService } from '../services/courses.service';
import { LessonsDataSource } from '../services/lessons.datasource';

@Component({
  selector: 'course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.css']
})
export class CourseComponent implements OnInit, AfterViewInit {
  course: Course;

  dataSource: LessonsDataSource;
  displayedColumns = ['seqNo', 'description', 'duration'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('input') input: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private coursesService: CoursesService
  ) {}

  ngOnInit() {
    this.course = this.route.snapshot.data['course'];
    this.dataSource = new LessonsDataSource(this.coursesService);
    this.dataSource.loadLessons(this.course.id, '', 'asc', 0, 3);
  }

  ngAfterViewInit() {
    // =====================
    // Server-Side filtering
    fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.loadLessonsPage();
        })
      )
      .subscribe();

    // ===================
    // Server-Side sorting

    // on sort order change move back to first page:
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    merge<EventEmitter<Sort>, EventEmitter<PageEvent>>(
      this.sort.sortChange,
      this.paginator.page
    )
      .pipe(
        tap(() => {
          this.loadLessonsPage();
        })
      )
      .subscribe();
  }

  loadLessonsPage() {
    this.dataSource.loadLessons(
      this.course.id,
      this.input.nativeElement.value,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }
}

// answer:
// so it appears that startWith(null) in pipe, upon subscription will
// IMMEDIANTELLY emit the given value, here NULL, but we don't care...
// what we care for is that the code inside subscribe (or further down the line,
// say in method TAP will run)! Such code can be in communitation, say via service
// like here, via custom dataSource... that potentially can trigger a following
// emission of the actual value we want, and not say the default [] coming from
// new BehaviorSubject<Lesson[]>([]).
// NOTE: such convolution may cause the EXPRESSION HAS CHANGED
// ngAfterViewInit() {
//   this.paginator.page
//     .pipe(
//       // tap(() => {
//       //   console.log('tap 1');
//       // }),
//       startWith(null), // how does startWith triggers this.dataSource.leadLessons()?
//       tap(() => {
//         // console.log('tap 2');
//         this.dataSource.loadLessons(
//           this.course.id,
//           '',
//           'asc',
//           this.paginator.pageIndex,
//           this.paginator.pageSize
//         );
//       })
//     )
//     .subscribe();
//   // .subscribe(() => {
//   //   console.log('in subscribe');
//   // });
// }
