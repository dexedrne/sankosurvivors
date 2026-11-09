// Only the avatar/camera view may lead confirmed shared play.
export function predictedView(view, pose, localId) {
  if (!pose) return view;
  return {...view, players:view.players.map(p=>p.id===localId?{...p,x:pose.x,z:pose.z,f:pose.f,mv:pose.mv}:p)};
}
