interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  name: string;
  // otros campos necesarios
}

interface UpdateInput extends Partial<RegisterInput> {
  id: string;
}
