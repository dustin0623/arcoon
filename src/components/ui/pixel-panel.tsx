import React from "react";
import clsx from "clsx";

const darkBorder = "/assets/ui/panel/dark_border.png";
const lightBorder = "/assets/ui/panel/light_border.png";
const whiteBorder = "/assets/ui/panel/white_border.png";
const redBorder = "/assets/ui/panel/red_border.png";
const greenBorder = "/assets/ui/panel/green_border.png";

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

interface BarPanelProps extends PanelProps {
  /** Content rendered inside a nested light panel centered within the bar. */
  center?: React.ReactNode;
  /** Content pinned to the right end of the bar, outside the center panel. */
  right?: React.ReactNode;
}

/**
 * One long dark-bordered bar with a dark-brown fill and a second panel nested
 * in its center — the combined HUD strip used at the top of the game screen.
 */
export const BarPanel: React.FC<BarPanelProps> = ({
  children,
  center,
  right,
  className,
  style,
  onClick,
}) => (
  <OuterPanel
    className={clsx("flex items-stretch justify-between gap-2 px-2 py-1.5", className)}
    style={style}
    onClick={onClick}
  >
    <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
    {center && (
      <InnerPanel className="flex w-44 shrink-0 flex-col justify-center px-2 py-1 sm:w-56">
        {center}
      </InnerPanel>
    )}
    {right && <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{right}</div>}
  </OuterPanel>
);

/** Small rounded chip used for counts and headings. */
export const Label: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  children,
  className,
}) => (
  <div
    className={clsx(
      "bg-silver-300 font-pixel flex items-center justify-center px-1 text-white text-shadow",
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
  /** Frame color: default (light), green for confirm/positive, red for danger/cancel. */
  variant?: "default" | "green" | "red";
}

const BUTTON_FRAMES = {
  default: { src: lightBorder, bg: "bg-brown-200 hover:bg-brown-300" },
  green: { src: greenBorder, bg: "bg-green-700 hover:bg-green-600" },
  red: { src: redBorder, bg: "bg-red-700 hover:bg-red-600" },
} as const;

/** Pixel-framed button matching the reference UI. */
export const PixelButton: React.FC<ButtonProps> = ({
  children,
  className,
  disabled,
  onClick,
  type = "button",
  variant = "default",
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={clsx(
      "flex cursor-pointer items-center justify-center px-2 py-1 text-white text-shadow disabled:cursor-not-allowed disabled:opacity-50",
      BUTTON_FRAMES[variant].bg,
      className,
    )}
    style={frame(BUTTON_FRAMES[variant].src, "5px", "15px")}
  >
    {children}
  </button>
);
