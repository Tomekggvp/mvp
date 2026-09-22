import type { Repository } from "../data/repository.js";
import type { CreateLeadInput } from "../domain/types.js";

export class LeadService {
  constructor(private readonly repository: Repository) {}
  list() { return this.repository.listLeads(); }
  create(input: CreateLeadInput) { return this.repository.createLead(input); }
}
