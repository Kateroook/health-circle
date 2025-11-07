type CurrentYear = {
  year: number;
};

export type RegistrationContext = { link: string } & CurrentYear;

export type SetupPasswordContext = { link: string } & CurrentYear;

export type FeedbackContext = { region: string; text: string; email: string } & CurrentYear;
