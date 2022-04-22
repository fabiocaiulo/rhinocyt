import { Time } from "@angular/common";

export interface Slide {
  id: string;
  date: Date;
  time: Time;
  image: string;
  annotations: any;
}
