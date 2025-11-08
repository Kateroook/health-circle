type CurrentYear = { year: number };

export type RegistrationContext = { code: string } & CurrentYear;

export type SetupPasswordContext = { code: string } & CurrentYear;
