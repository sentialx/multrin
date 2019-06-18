const pattern = /^(\w+:\/\/)?([^\s.]+\.\S{2}|localhost[:?\d]*)\S*$/;

export const isURL = (input: string): boolean => {
  return pattern.test(input);
};
