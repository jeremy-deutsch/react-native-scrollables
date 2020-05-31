import { ComponentType } from "react";

export type GetProps<Component> = Component extends ComponentType<infer Props>
  ? Props
  : never;
