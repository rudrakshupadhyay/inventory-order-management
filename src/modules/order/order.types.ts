interface ParticularOrder {
  productId: string;
  quantity: number;
}

export interface CreateOrderBody {
  productList: ParticularOrder[];
}