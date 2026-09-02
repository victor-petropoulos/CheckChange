function med(x) {
  if (x > 0) {
    return 1;
  } else if (x > 1) {
    return 2;
  } else if (x > 2) {
    return 3;
  }
  for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) {
      x++;
    } else {
      x--;
    }
  }
  return x;
}
module.exports = { med };