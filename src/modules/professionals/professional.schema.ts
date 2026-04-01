import { z } from 'zod';

export const professionalIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
