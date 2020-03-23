import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Lesson } from '../model/lesson';
import { CoursesService } from './courses.service';
import { catchError, finalize } from 'rxjs/operators';

export class LessonsDataSource implements DataSource<Lesson> {
  private lessonsSubject = new BehaviorSubject<Lesson[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public loading$ = this.loadingSubject.asObservable();

  constructor(private coursesService: CoursesService) {}

  loadLessons(
    couseId: number,
    filter: string,
    sortDirection: string,
    pageIndex: number,
    pageSize: number
  ) {
    this.loadingSubject.next(true);
    this.coursesService
      .findLessons(couseId, filter, sortDirection, pageIndex, pageSize)
      .pipe(
        catchError(() => of([])),
        finalize(() => {
          this.loadingSubject.next(false);
        })
      )
      .subscribe(lessons => {
        this.lessonsSubject.next(lessons);
      });
  }

  connect(
    collectionViewer: CollectionViewer
  ): Observable<Lesson[] | readonly Lesson[]> {
    return this.lessonsSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.lessonsSubject.complete();
    this.loadingSubject.complete();
  }
}
