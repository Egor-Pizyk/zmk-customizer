/** Shared across file-action closures for the lifetime of the provider. */
export function createImportSession() {
  let request = 0;
  let revision = 0;
  return {
    getRequest: () => request,
    begin: () => {
      request += 1;
      return { request, revision };
    },
    invalidate: () => {
      revision += 1;
    },
    status: (token: { readonly request: number; readonly revision: number }) => {
      if (token.request !== request) {
        return 'superseded';
      }
      return token.revision === revision ? 'current' : 'changed';
    },
  };
}
