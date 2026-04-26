import * as React from "react";

type SpinnerMorphProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  bg?: string;
  fill?: string;
  rotateDur?: string;
  morphDur?: string;
};

const SpinnerMorph = ({
  size = 48,
  bg = "transparent",
  fill = "#002147",
  rotateDur = "6s",
  morphDur = "6s",
  className,
  ...rest
}: SpinnerMorphProps) => {
  const initialPath =
    "M120 26C149 26 174 42 188 66C203 91 203 121 189 146C175 171 149 188 120 188C91 188 65 171 51 146C37 121 37 91 52 66C66 42 91 26 120 26Z";
  const dValues =
    `${initialPath};` +
    "M120 30C151 20 181 39 192 70C204 104 185 130 181 160C177 190 145 206 115 198C84 190 62 167 43 141C24 115 34 78 58 56C79 37 92 39 120 30Z;" +
    initialPath;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      role="status"
      aria-label="Loading"
      {...rest}
    >
      {bg !== "transparent" && <circle cx="120" cy="120" r="112" fill={bg} />}
      <path d={initialPath} fill={fill} fillRule="evenodd" stroke="none">
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from="0 120 120"
          to="-360 120 120"
          dur={rotateDur}
          repeatCount="indefinite"
        />
        <animate
          attributeName="d"
          values={dValues}
          dur={morphDur}
          repeatCount="indefinite"
          fill="freeze"
        />
      </path>
    </svg>
  );
};

export default SpinnerMorph;
