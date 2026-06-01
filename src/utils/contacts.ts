import { ServiceContacts } from '../types';

export function getBestEmail(contacts: ServiceContacts): string | undefined {
  return contacts.dpo || contacts.privacy || contacts.general;
}
