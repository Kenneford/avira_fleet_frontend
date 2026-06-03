import {
  styled,
  Toolbar,
  TextField,
  Box,
  Button,
  TextareaAutosize,
} from "@mui/material";
import { MobileDatePicker } from "@mui/x-date-pickers";

// Navbar Styling
export const StyledNavbar = {
  Navbar: styled(Box)({
    height: "3.2rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "green",
    padding: ".5rem",
  }),
  CurrentUser: styled(Toolbar)({
    position: "relative",
    display: "flex",
    padding: "0",
    justifyContent: "flex-end",
    gap: ".5rem",
    alignItems: "center",
  }),
};
export const CustomBox = styled(Box)(({ maxWidth, bgColor, p, m }) => ({
  maxWidth: maxWidth,
  margin: m,
  backgroundColor: bgColor,
  padding: p,
  // paddingBottom: "1rem",
  // paddingLeft: ".5rem",
  // paddingRight: ".5rem",
}));

export const ContainerBox = styled(Box)({
  width: { xs: "100%", sm: "95%", md: "90%", lg: "90%", xl: "75%" },
  // margin: "auto",
  padding: "1rem 1rem 2rem",
  // paddingBottom: "2rem",
  display: "flex",
  flexDirection: "column",
});
export const CustomTextField = styled(TextField)(({ value }) => ({
  "& .MuiOutlinedInput-root": {
    color: "#696969", // Custom focus label color
    fontSize: ".8rem",
    "& legend": {
      width: "auto",
      paddingLeft: value ? 5 : 0,
      paddingRight: value ? 5 : 0,
      overflow: "visible",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#454343ad", // Change focus border color
      boxShadow: "2px 2px 3px 0px #454343ad",
      "& legend": {
        width: "auto",
        paddingLeft: 5,
        paddingRight: 5,
        overflow: "visible",
      },
    },
    // Border styles for hover
    "&:hover fieldset": {
      border: ".5px solid #454343ad", // Border on hover
      boxShadow: "2px 2px 3px 0px #1a0505ad",
    },
  },
  // Label size and color for focused state
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#696969", // Custom focus label color
    fontSize: "1rem",
  },
  "& .MuiInputLabel-root": {
    fontSize: value ? "1rem" : ".8rem",
    "& legend": {
      width: "auto",
      paddingLeft: 5,
      paddingRight: 5,
      overflow: "visible",
    },
  },
  // Target the required asterisk
  "& .MuiInputLabel-asterisk": {
    color: "red", // Change the asterisk color to red
  },
}));
export const DatePickerTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    color: "#696969", // Custom focus label color
    fontSize: ".8rem",
    "& legend": {
      fontSize: ".8rem",
    },
  },
  // Target the required asterisk
  "& .MuiInputLabel-asterisk": {
    color: "red", // Change the asterisk color to red
  },
});
export const StyledTextarea = styled(TextareaAutosize)(({ theme }) => ({
  width: "100%",
  maxWidth: "100%",
  padding: "12px",
  borderRadius: 4,
  border: `1px solid ${theme.palette.grey[400]}`,
  fontSize: ".8rem",
  fontFamily: theme.typography.fontFamily,
  "&:focus": {
    borderColor: "#454343ad", // Change focus border color
    boxShadow: "2px 2px 3px 0px #454343ad",
    outline: "none",
  },
}));
export const CustomMobileDatePicker = styled(MobileDatePicker)({
  // Border styles for focused state
  "& .MuiOutlinedInput-root": {
    // fontSize: ".65em",
    "& fieldset": {
      borderColor: "#b5b3b3 !important", // Remove the border color
      // boxShadow: "2px 2px 3px 0px #454343ad",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#454343ad", // Change focus border color
      boxShadow: "2px 2px 3px 0px #454343ad",
    },
    "&:hover fieldset": {
      border: ".5px solid #454343ad", // Disable border on hover
      boxShadow: "2px 2px 3px 0px #1a0505ad",
    },
  },
  // Label color on focus
  "& .MuiInputLabel-root.Mui-focused": {
    fontSize: "1.1rem",
    color: "#454343ad", // Custom focus label color
    // borderColor: "transparent",
  },
  "& .MuiInputLabel-root": {
    // fontSize: "1.05rem",
    fontSize: "1.1rem",
    color: "#454343ad !important", // Custom focus label color
    border: "none",
  },
});
export const CustomMenuProps = {
  PaperProps: {
    sx: {
      maxHeight: 250, // Custom dropdown height
      maxWidth: 300, // Custom dropdown width
      fontSize: ".8rem",
      // borderRadius: ".4rem",
      "&::-webkit-scrollbar": {
        width: "6px", // Scrollbar width
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "#9a9a9a", // Thumb color
        borderRadius: ".4rem",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        backgroundColor: "#8d8c8c", // Thumb hover color
      },
      "&::-webkit-scrollbar-track": {
        backgroundColor: "#fff", // Track color
        borderRadius: ".4rem",
      },
    },
  },
};

export const CustomSearchField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    color: "#696969", // Custom focus label color
    // fontSize: ".8rem",
    "& legend": {
      // fontSize: ".8rem",
      display: "inline",
      width: "auto", // Ensure the label width is appropriate
    },
    "&.Mui-focused fieldset": {
      borderColor: "#454343ad", // Change focus border color
      boxShadow: "2px 2px 3px 0px #454343ad",
    },
    // Border styles for hover
    "&:hover fieldset": {
      border: ".5px solid #454343ad", // Border on hover
      boxShadow: "2px 2px 3px 0px #1a0505ad",
    },
  },
  // Label size and color for focused state
  "& .MuiInputLabel-root": {
    color: "#696969", // Custom focus label color
    fontSize: ".8rem",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#696969", // Custom focus label color
    fontSize: "1rem",
  },
});
export const PageNotFoundWrapBox = styled(Box)({
  width: "23em",
  padding: "0 1rem 3rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  marginTop: "2rem",
  // border: ".5px solid #454343ad", // Disable border on hover
  // boxShadow: "2px 2px 3px 0px #454343ad",
  filter: "drop-shadow(2rem 3rem 4em #ffffffad)",
  // webkitBoxShadow: " 0px 0px 16px -8px rgba(0, 0, 0, 0.68)",
  boxShadow: "0px 0px 16px -8px rgba(0, 0, 0, 0.68)",
});
export const CustomizedButton = styled(Button)({
  fontSize: ".8em",
  letterSpacing: "1px",
});
export const SidebarSubLinksContainer = styled("div")(
  ({ theme, isExpanded, contentHeight }) => ({
    maxHeight: isExpanded ? `${contentHeight}px` : "0",
    overflow: "hidden",
    transition: "max-height 0.5s ease-out",
  }),
);
export const ExpandableTitleTextField = styled(TextField)(({ focused }) => ({
  transition: "width 0.3s ease",
  width: "100%",
  // width: focused ? "100%" : "70%",
  // Border styles for focused state
  "& .MuiOutlinedInput-root": {
    "&.Mui-focused fieldset": {
      borderColor: "#454343ad", // Change focus border color
      boxShadow: "2px 2px 3px 0px #454343ad",
    },
    // Border styles for hover
    "&:hover fieldset": {
      border: ".5px solid #454343ad", // Disable border on hover
      boxShadow: "2px 2px 3px 0px #1a0505ad",
    },
  },
  // Label color on focus
  "& .MuiInputLabel-root.Mui-focused": {
    fontSize: "1.05rem",
    color: "#454343ad", // Custom focus label color
    borderColor: "transparent",
  },
  // Target the required asterisk
  "& .MuiInputLabel-asterisk": {
    color: "red", // Change the asterisk color to red
  },
}));
export const FileInput = styled("input")({
  display: "none",
});
