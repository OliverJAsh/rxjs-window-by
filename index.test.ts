import { Observable } from "rxjs";
import { marbles } from "rxjs-marbles/jest";
import { windowBy } from ".";

describe("windowBy", () => {
  it(
    "works",
    marbles((m) => {
      const source$ = m.cold("a--a--b--b--a--|");
      const sourceSubs = "    ^--------------!";
      const a = m.cold("      a--a--|");
      const b = m.cold("            b--b--|");
      const c = m.cold("                  a--|");
      const expected = "      a-----b-----c--|";
      const expectedValues = { a, b, c };
      const actual$ = source$.pipe(windowBy((item) => item));
      // Note: we need a cast here because our expect contains `Observable`s rather than
      // `GroupedObservable`s.
      m.expect<Observable<string>>(actual$).toBeObservable(
        expected,
        expectedValues
      );
      m.expect(source$).toHaveSubscriptions(sourceSubs);
    })
  );
  it(
    "given a synchronous source observable, only subscribes once",
    marbles((m) => {
      const source$ = m.cold("(a|)");
      const sourceSubs = "    (^!)";
      const a = m.cold("      (a|)");
      const expected = "      (a|)";
      const expectedValues = { a };
      const actual$ = source$.pipe(windowBy((item) => item));
      // Note: we need a cast here because our expect contains `Observable`s rather than
      // `GroupedObservable`s.
      m.expect<Observable<string>>(actual$).toBeObservable(
        expected,
        expectedValues
      );
      m.expect(source$).toHaveSubscriptions([sourceSubs]);
    })
  );
});
