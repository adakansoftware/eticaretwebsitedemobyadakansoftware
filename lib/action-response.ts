export type ActionResult<TData = undefined> =
  | { success: true; message?: string; data: TData }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> };

export function actionSuccess<TData>(data: TData, message?: string): ActionResult<TData> {
  return { success: true, message, data };
}

export function actionError<TData = undefined>(
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<TData> {
  return { success: false, message, fieldErrors };
}
