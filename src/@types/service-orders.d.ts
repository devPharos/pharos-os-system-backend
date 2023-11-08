export interface ServiceOrderDetails {
  id: string;
  companyId: string;
  serviceOrderId: string;
  projectId: string;
  projectServiceId: string;
  description: string;
  startDate: Date;
  endDate: Date;
}

export interface ServiceOrderExpenses {
  id: string;
  companyId: string;
  serviceOrderId: string;
  projectId: string;
  projectExpenseId: string;
  fileId: string | null;
  value: string;
  description: string;
}

export interface ServiceOrder {
  id: string;
  clientId: string;
  client: string;
  collaborator: string;
  status: "Aberto" | "Enviado" | "Faturado" | "Validado" | "Rascunho";
  date: Date;
  startDate: Date;
  endDate: Date;
  remote: boolean;
  osDetails: ServiceOrderDetails[];
  osExpenses: ServiceOrderExpenses[];
}

export interface ProjectDetails {
  projectDetails: ServiceOrderDetails;
  projectExpenses: ServiceOrderExpenses[];
}
