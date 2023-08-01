const getProductCode = (productName) => {
  return productName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const getProductVariantSku = (productCode, variantName, modifier) => {
  // const productInitials = getProductCode(productName);

  if (!modifier) {
    return `${productCode}-${variantName}`;
  }

  const modifierString = `${modifier.name}_${modifier.value}`;
  return `${productCode}-${variantName}-${modifierString}`;
};

const mapProductVariants = (product) => {
  const { name, brand, code, _id, variants, modifier } = product;

  return variants.reduce((variants, variant) => {
    if (modifier) {
      modifier.values.forEach((modifierValue) => {
        variants.push({
          ...variant,
          name: `${product.name} ${variant.name} ${modifierValue}`,
          brand: product.brand,
          variant: variant.name,
          modifier: {
            name: modifier.name,
            value: modifierValue,
          },
          product: product._id,
        });
      });

      return variants;
    }

    variants.push({
      sku: getProductVariantSku(product.code, variant.name),
      product: product._id,
      ...variant,
    });

    return variants;
  }, []);
};

/* const mapProductVariants = (product) => {
  const { name, brand, code, _id, variants, modifiers } = product;

  return variants.reduce((variants, variant) => {
    if (modifiers.length) {
      modifiers.forEach((modifierItem) => {
        modifierItem.values.forEach((modifier) => {
          variants.push({
            ...variant,
            name: `${product.name} ${variant.name} ${modifier}`,
            brand: product.brand,
            variant: variant.name,
            sku: getProductVariantSku(product.code, variant.name, {
              name: modifierItem.name,
              value: modifier,
            }),
            modifier: {
              name: modifierItem.name,
              value: modifier,
            },
            product: product._id,
          });
        });
      });

      return variants;
    }

    variants.push({
      sku: getProductVariantSku(product.code, variant.name),
      product: product._id,
      ...variant,
    });

    return variants;
  }, []);
}; */

module.exports = {
  getProductVariantSku,
  getProductCode,
  mapProductVariants,
};
