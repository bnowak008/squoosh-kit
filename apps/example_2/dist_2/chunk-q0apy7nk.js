// @bun
function H(F){if(!F||typeof F!=="object")throw TypeError("image must be an object");let D=F;if(!("data"in D))throw TypeError("image.data is required");let{data:E}=D;if(!(E instanceof Uint8Array||E instanceof Uint8ClampedArray))throw TypeError("image.data must be Uint8Array or Uint8ClampedArray");if(!("width"in D)||!("height"in D))throw TypeError("image.width and image.height are required");let{width:l,height:q}=D;if(typeof l!=="number"||!Number.isInteger(l)||l<=0)throw RangeError(`image.width must be a positive integer, got ${l}`);if(typeof q!=="number"||!Number.isInteger(q)||q<=0)throw RangeError(`image.height must be a positive integer, got ${q}`);let G=l*q*4;if(E.length<G)throw RangeError(`image.data too small: ${E.length} bytes, expected at least ${G} bytes for ${l}x${q} RGBA image`)}
export{H as b};

//# debugId=7AE3A24486B7640E64756E2164756E21
