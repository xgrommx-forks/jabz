import {Monoid, MonoidConstructor} from "./monoid";
import {Applicative, ApplicativeDictionary} from "./applicative";
import {Traversable} from "./traversable";
import {Monad} from "./monad";

export type MaybeMatch<T, K> = {
  nothing: () => K,
  just: (t: T) => K
};

export abstract class Maybe<A> implements Monad<A>, Traversable<A> {
  abstract match<K>(m: MaybeMatch<any, K>): K;
  of: <B>(v: B) => Maybe<B> = of;
  abstract chain<B>(f: (a: A) => Maybe<B>): Maybe<B>;
  abstract flatten<B>(m: Monad<Monad<B>>): Monad<B>;
  abstract map<B>(f: (a: A) => B): Maybe<B>;
  abstract mapTo<B>(b: B): Maybe<B>;
  lift<T1, R>(f: (t: T1) => R, m: Maybe<T1>): Maybe<R>;
  lift<T1, T2, R>(f: (t: T1, u: T2) => R, m1: Maybe<T1>, m2: Maybe<T2>): Maybe<R>;
  lift<T1, T2, T3, R>(f: (t1: T1, t2: T2, t3: T3) => R, m1: Maybe<T1>, m2: Maybe<T2>, m3: Maybe<T3>): Maybe<R>;
  lift(f: Function, ...args: any[]): any {
    switch (f.length) {
    case 1:
      return args[0].val !== undefined ? just(f(args[0].val)) : nothing;
    case 2:
      if (args[0].val !== undefined && args[1].val !== undefined) {
        return just(f(args[0].val, args[1].val));
      } else {
        return nothing;
      }
    case 3:
      if (args[0].val !== undefined &&
          args[1].val !== undefined &&
          args[2].val !== undefined) {
        return just(f(args[0].val, args[1].val, args[2].val));
      } else {
        return nothing;
      }
    }
  }
  abstract foldMapId<M extends Monoid<M>>(id: M, f: (a: A) => M): M;
  abstract foldMap<M extends Monoid<M>>(f: MonoidConstructor<A, M>): M;
  abstract fold<B>(acc: B, f: (a: A, b: B) => B): B;
  abstract size(): number;  abstract traverse<B>(a: ApplicativeDictionary, f: (a: A) => Applicative<B>): Applicative<Traversable<B>>;
}

function of<V>(v: V): Maybe<V> {
  return new Just(v);
}

class Nothing<A> extends Maybe<A> {
  constructor() {
    super();
  };
  match<K>(m: MaybeMatch<any, K>): K {
    return m.nothing();
  }
  chain<B>(f: (a: A) => Maybe<B>): Maybe<A> {
    return this;
  }
  flatten<B>(m: Maybe<Maybe<B>>): Maybe<B> {
    return m.match({
      nothing: () => nothing(),
      just: (m) => m
    });
  }
  map<B>(f: (a: A) => B): Maybe<B> {
    return new Nothing<B>();
  }
  mapTo<B>(b: B): Maybe<B> {
    return new Nothing<B>();
  }
  foldMapId<M extends Monoid<M>>(id: M, f: (a: A) => M): M {
    return id;
  }
  foldMap<M extends Monoid<M>>(f: MonoidConstructor<A, M>): M {
    return f.identity();
  }
  fold<B>(f: (a: A, b: B) => B, acc: B): B {
    return acc;
  }
  size(): number {
    return 0;
  }
  traverse<B>(a: ApplicativeDictionary, f: (a: A) => Applicative<B>): Applicative<Traversable<B>> {
    return a.of(_nothing);
  }
}

class Just<A> extends Maybe<A> {
  val: A;
  constructor(val: A) {
    super();
    this.val = val;
  }
  match<K>(m: MaybeMatch<A, K>): K {
    return m.just(this.val);
  }
  chain<B>(f: (v: A) => Maybe<B>): Maybe<B> {
    return f(this.val);
  }
  flatten<B>(m: Maybe<Maybe<B>>): Maybe<B> {
    return m.match({
      nothing: () => nothing(),
      just: (m) => m
    });
  }
  map<B>(f: (a: A) => B): Maybe<B> {
    return new Just(f(this.val));;
  }
  mapTo<B>(b: B): Maybe<B> {
    return new Just<B>(b);
  }
  foldMapId<M extends Monoid<M>>(id: M, f: (a: A) => M): M {
    return f(this.val);
  }
  foldMap<M extends Monoid<M>>(f: MonoidConstructor<A, M>): M {
    return f(this.val);
  }
  fold<B>(f: (a: A, b: B) => B, acc: B): B {
    return f(this.val, acc);
  }
  size(): number {
    return 1;
  }
  traverse<B>(a: ApplicativeDictionary, f: (a: A) => Applicative<B>): Applicative<Traversable<B>> {
    return f(this.val).map(just);
  }
}

export function just<V>(v: V): Maybe<V> {
  return new Just(v);
}

const _nothing = new Nothing();

export function nothing<V>(): Maybe<V> {
  return _nothing;
}
