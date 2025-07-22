import Svg, { Path, Circle } from 'react-native-svg';

export const PrinterSvg = () => {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 495 495"
      xmlSpace="preserve"
      width={50}
      height={50}
    >
      <Path d="M247.5 0H417.5V92.5H247.5z" fill="#46f8ff" />
      <Path d="M77.5 0H247.5V92.5H77.5z" fill="#9bfbff" />
      <Path
        d="M247.5 232.5L247.5 92.5 0 92.5 0 412.5 77.5 412.5 77.5 232.5z"
        fill="#ffda44"
      />
      <Path
        d="M495 92.5H247.5v140h170v180H495v-320zm-97.5 110c-11.046 0-20-8.954-20-20s8.954-20 20-20 20 8.954 20 20-8.954 20-20 20z"
        fill="#ffcd00"
      />
      <Circle cx={397.5} cy={182.5} r={20} fill="#fff" />
      <Path
        d="M147.5 412.5L147.5 372.5 247.5 372.5 247.5 342.5 147.5 342.5 147.5 302.5 247.5 302.5 247.5 232.5 77.5 232.5 77.5 495 247.5 495 247.5 412.5z"
        fill="#9bfbff"
      />
      <Path
        d="M247.5 232.5L247.5 302.5 347.5 302.5 347.5 342.5 247.5 342.5 247.5 372.5 347.5 372.5 347.5 412.5 247.5 412.5 247.5 495 417.5 495 417.5 232.5z"
        fill="#46f8ff"
      />
      <Path d="M147.5 372.5H347.5V412.5H147.5z" fill="#005ece" />
      <Path d="M147.5 302.5H347.5V342.5H147.5z" fill="#005ece" />
    </Svg>
  );
};
