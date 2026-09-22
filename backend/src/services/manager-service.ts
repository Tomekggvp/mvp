import type { Repository } from "../data/repository.js";
import type { CreateManagerInput, UpdateManagerInput } from "../domain/types.js";

export class ManagerService {
  constructor(private readonly repository: Repository) {}
  list() { return this.repository.listManagers(); }
  create(input: CreateManagerInput) { return this.repository.createManager(input); }
  update(id: string, input: UpdateManagerInput) { return this.repository.updateManager(id, input); }
}
