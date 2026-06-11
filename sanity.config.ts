import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

const projectId = import.meta.env.SANITY_PROJECT_ID as string | undefined;
const dataset = (import.meta.env.SANITY_DATASET as string | undefined) ?? 'production';

export default defineConfig({
  name: 'default',
  title: 'The Boat Yard Sauna',
  projectId: projectId ?? 'project-id-not-set',
  dataset: dataset,
  plugins: [structureTool(), visionTool()],
  basePath: '/admin',
});
