const populateOptions = {
  path: "items",
  populate: {
    path: "product variant",
    select: "name brand amount",
  },
};

const transform = (invoice) => {
  return {
    ...invoice._doc,
    items: invoice.items.map((item) => {
      return {
        id: {
          product: item.product.id,
          variant: item.variant.id,
        },
        name: item.product.name,
        brand: item.product.brand,
        variant: item.variant.name,
        amount: item.variant.amount,
        modifier: item.modifier,
        quantity: item.quantity,
      };
    }),
  };
};

module.exports = {
  populateOptions,

  transform,
};
