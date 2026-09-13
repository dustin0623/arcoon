import React from "react";
import clsx from "clsx";

const darkBorder = "/assets/ui/panel/dark_border.png";
const lightBorder = "/assets/ui/panel/light_border.png";
const whiteBorder = "/assets/ui/panel/white_border.png";

const frame = (src: string, width: string, radius: string): React.CSSProperties => ({
  borderStyle: "solid",
  borderWidth: width,
  borderImage: `url(${src}) 30 stretch`,
  borderImageSlice: "25%",
  borderImageRepeat: "repeat",
  imageRendering: "pixelated",
  borderRadius: radius,
});

interface PanelProps {
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement> | undefined;
}

/** Dark pixel frame — the outer shell of every panel. */
export const OuterPanel: React.FC<PanelProps> = ({ children, className, style, onClick }) => (
  <div
    onClick={onClick}
    className={clsx("bg-brown-600 p-0.5 text-white text-shadow shadow-lg", className)}
    style={{ ...frame(darkBorder, "6px", "20px"), ...style }}
  >
    {children}
  </div>
);

/** Light pixel frame — used inside an OuterPanel for content sections. */
export const InnerPanel: React.FC<PanelProps> = ({ children, className, style, onClick }) => (
  <div
    onClick={onClick}
    className={clsx("bg-brown-300 p-1", className)}
    style={{ ...frame(lightBorder, "6px", "20px"), ...style }}
  >
    {children}
  </div>
);

/** Full pixel panel: dark outer frame wrapping a light inner frame. */
export const Panel: React.FC<PanelProps> = ({ children, className, style, onClick }) => (
  <OuterPanel className={className} style={style} onClick={onClick}>
    <InnerPanel>{children}</InnerPanel>
  </OuterPanel>
);

/** Small rounded chip used for counts and headings. */
export const Label: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  children,
  className,
}) => (
  <div
    className={clsx(
      "bg-silver-300 flex items-center justify-center px-1 text-white text-shadow",
      className,
    )}
    style={frame(whiteBorder, "5px", "15px")}
  >
    {children}
  </div>
);

interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
}

/** Pixel-framed button matching the reference UI. */
export const PixelButton: React.FC<ButtonProps> = ({
  children,
  className,
  disabled,
  onClick,
  type = "button",
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={clsx(
      "bg-brown-200 hover:bg-brown-300 flex w-full cursor-pointer items-center justify-center p-1 text-white text-shadow disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    style={frame(lightBorder, "5px", "15px")}
  >
    {children}
  </button>
);
