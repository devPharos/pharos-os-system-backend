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
}

export interface ServiceOrder {
  id: string;
  client: string;
  collaborator: string;
  status: "Aberto" | "Enviado" | "Faturado" | "Cancelado";
  date: Date;
  startDate: Date;
  endDate: Date;
  osDetails: ServiceOrderDetails[];
  osExpenses: ServiceOrderExpenses[];
}
