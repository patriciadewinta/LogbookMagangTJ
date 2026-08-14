import type { CSSProperties, ComponentType, ReactNode } from "react";

declare module "react" {
  interface ViewTransitionProps {
    name?: string;
    default?: string;
    style?: CSSProperties;
    share?: string;
    enter?: string;
    exit?: string;
    children?: ReactNode;
  }

  export const ViewTransition: ComponentType<ViewTransitionProps>;
}
