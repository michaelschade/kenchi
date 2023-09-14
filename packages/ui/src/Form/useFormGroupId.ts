import { useState } from 'react';

let nextFormGroupId = 1;
export default function useFormGroupId(id?: string) {
  const [staticId] = useState(() => id || `form-group-${nextFormGroupId++}`);
  return staticId;
}
