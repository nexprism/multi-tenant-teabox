export default function AnimatedGradientBorder({ align }) {
  return (
    <div className={`w-[200px] ${ align == "left" ? "" : "mx-auto" } p-[3px] rounded-xl greenTwo animate-gradient-x bg-[length:200%_200%]`}>
    </div>
  );
}
