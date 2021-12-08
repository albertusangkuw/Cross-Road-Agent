class Item {
  constructor(
    label = "",
    size = 1,
    isControllable = false,
    isDangerous = false,
    isMoving = false,
    isARoad = false,
    isAFood = false,
    position = { x: -1, y: -1, pParent: [] },
    status = 0,
    cost = 0
  ) {
    this.label = label;
    this.status = status;
    this.cost = cost;
    this.size = size;
    this.isControllable = isControllable;
    this.isDangerous = isDangerous;
    this.isMoving = isMoving;
    this.isARoad = isARoad;
    this.isAFood = isAFood;
    this.position = position;
  }
}
