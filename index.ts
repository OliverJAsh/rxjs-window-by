import { groupBy, share, distinctUntilChanged, skip } from "rxjs/operators";
import { GroupedObservable, OperatorFunction } from "rxjs";

/**
 * RxJS provides a few different window operators, however it doesn't provide an operator that
 * allows you to decide when to start/end a window according to the contents of the observable
 * itself.
 *
 * It is possible to achieve this using the `window` operator but it's difficult to do correctly:
 * see https://stackblitz.com/edit/rxjs-window-prioritize?file=index.ts and
 * https://twitter.com/OliverJAsh/status/1336287693580464128.
 *
 * Furthermore, unlike `groupBy` which includes a `key` on the `GroupedObservable`, `window` does
 * not provide any information about the window:
 *
 * ```ts
 * // https://stackblitz.com/edit/rxjs-compat-rxlmbt?file=index.ts
 *
 * import * as Rx from "rxjs";
 * import { groupBy, mergeMap, tap } from "rxjs/operators";
 *
 * console.clear();
 *
 * const source = Rx.of("foo", "foo", "bar", "foo").pipe(
 *   groupBy(item => item),
 *   tap(group$ => console.log(`group ${group$.key}: start`)),
 *   mergeMap(group$ =>
 *     group$.pipe(tap(item => console.log(`group ${group$.key} item: ${item}`)))
 *   )
 * );
 *
 * source.subscribe();
 *
 * // group foo: start
 * // group foo item: foo
 * // group foo item: foo
 * // group bar: start
 * // group bar item: bar
 * // group foo item: foo
 * ```
 *
 * We need something like `groupBy` but for windows instead of groups. (There can only be one window
 * as opposed to groups where there can be multiple running at the same time.) Like `groupBy`, we
 * need the ability to start/end a window according to the contents of the observable, and we need
 * something like `key` which provides information about the type of window that is currently
 * running.
 *
 * That's why we built this custom operator.
 */
export const windowBy = <K, T>(
  keyFn: (t: T) => K
): OperatorFunction<T, GroupedObservable<K, T>> => (source) => {
  const sharedSource = source.pipe(share());

  const newWindow = sharedSource.pipe(
    distinctUntilChanged((a, b) => keyFn(a) === keyFn(b))
  );

  return sharedSource.pipe(
    groupBy(keyFn, undefined, () =>
      newWindow.pipe(
        // Skip the first window as that is what created the current group.
        skip(1)
      )
    )
  );
};
