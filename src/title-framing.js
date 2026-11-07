// Move only the title's projection; the world and gameplay camera keep their coordinates.
export function frameTitleCamera(camera, point, width, height, targetY) {
  camera.clearViewOffset();
  if (!(width > 0 && height > 0 && Number.isFinite(targetY))) return;
  camera.updateMatrixWorld();
  const currentY = (1 - point.clone().project(camera).y) * height / 2;
  camera.setViewOffset(width, height, 0, currentY - targetY, width, height);
}
