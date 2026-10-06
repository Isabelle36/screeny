export const FIELD_RING = 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.14)]';
export const FIELD_RING_FOCUS = 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.42),0_0_0_3px_rgb(0_0_0/0.06)]';
export const FIELD_RING_INVALID = 'shadow-[inset_0_0_0_1.5px_#b42318,0_0_0_3px_rgb(180_35_24/0.1)]';

export const FIELD_SURFACE = `bg-background text-body text-foreground placeholder:text-muted ${FIELD_RING} transition-shadow duration-150 ease-out focus:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.42),0_0_0_3px_rgb(0_0_0/0.06)] aria-invalid:shadow-[inset_0_0_0_1.5px_#b42318] aria-invalid:focus:shadow-[inset_0_0_0_1.5px_#b42318,0_0_0_3px_rgb(180_35_24/0.1)]`;

export const FIELD = `h-11 w-full rounded-[12px] px-3.5 ${FIELD_SURFACE}`;
