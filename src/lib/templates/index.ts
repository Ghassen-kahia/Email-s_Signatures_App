import type { AppState } from '../../types';
import { buildModel, resolveImage, type RenderMode } from './model';
import { TEMPLATES } from './templates';

export type { RenderMode } from './model';

/** Render the signature as an email-safe HTML fragment. */
export function renderSignature(state: AppState, mode: RenderMode): string {
  const model = buildModel(state, mode);
  const template = TEMPLATES[state.design.template] ?? TEMPLATES.tech;
  return `<!-- Signature generated locally by Signature Studio -->\n${template(model)}`;
}

/** Wrap the fragment in a standalone HTML document for download. */
export function renderDocument(fragment: string, title: string): string {
  const safeTitle = title.replace(/[<>&"]/g, '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle || 'Email signature'}</title>
</head>
<body style="margin:0;padding:24px;background-color:#ffffff;">
${fragment}
</body>
</html>
`;
}

export interface ImageExportStatus {
  photo: ReturnType<typeof resolveImage>;
  logo: ReturnType<typeof resolveImage>;
}

/** Report how each image will be handled in the export. */
export function imageExportStatus(state: AppState): ImageExportStatus {
  const embed = state.exportOptions.embedLocalImages;
  return {
    photo: resolveImage(state.profile.photo, '', 'export', embed),
    logo: resolveImage(state.profile.logo, '', 'export', embed),
  };
}
