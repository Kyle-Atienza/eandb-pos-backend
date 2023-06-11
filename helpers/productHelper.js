const getProductItemId = (data) => {
  console.log(data.modifier.name);

  const productName = data.product.name;
  const productInitials = productName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  const variantName = data.variant.name;
  const modifierString = `${data.modifier.name}_${data.modifier.value}`;

  return `${productInitials}-${variantName}-${modifierString}`;
};

module.exports = {
  getProductItemId,
};
