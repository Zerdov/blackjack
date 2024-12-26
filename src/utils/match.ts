import { R, Result, O, Option } from "@mobily/ts-belt";

export const matchR = <Pos, Neg, FnRightRes, FnLeftRes>(
  result: Result<Pos, Neg>,
  cases: {
    Ok: (value: Pos) => FnRightRes;
    Err: (error: Neg) => FnLeftRes;
  },
): FnRightRes | FnLeftRes => {
  return R.isOk(result) ? cases.Ok(result._0) : cases.Err(result._0);
};


export const matchO = <TT, FnSomeRes, FnNoneRes>(
  option: Option<TT>,
  cases: {
    Some: (value: TT) => FnSomeRes;
    None: () => FnNoneRes;
  },
): FnSomeRes | FnNoneRes => {
  return O.isSome(option ?? O.None) ? cases.Some(O.getExn(option)) : cases.None();
};