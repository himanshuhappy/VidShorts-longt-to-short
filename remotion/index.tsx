import { registerRoot, Composition } from "remotion";
import { ClipVideoComposition } from "../components/dashboard/ClipVideoComposition";

const RemotionRoot = () => {
  return (
    <Composition
      id="ClipVideoComposition"
      component={ClipVideoComposition}
      durationInFrames={3600} // Safe default max (e.g. 2 minutes = 3600 frames at 30fps)
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        src: "",
        startTimeSec: 0,
        endTimeSec: 10,
        captions: "",
        fontFamily: "sans-serif",
        textColor: "#FFE600",
        highlightColor: "#FFE600",
        highlightTextColor: "#000000",
        captionStyle: "highlight",
      }}
    />
  );
};

registerRoot(RemotionRoot);
