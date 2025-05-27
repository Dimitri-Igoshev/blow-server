class ServiceInKit {
  serviceId: string;
  period?: string;
  quantity?: number;
}

export class BuyServiceDto {
  userId: string;
  serviceId: string;
  name?: string;
  period?: string;
  quantity?: number;
  price: number;
  services?: any[];
  servicesOptions?: any[];
}
