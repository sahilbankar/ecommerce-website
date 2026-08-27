import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { toggleTheme, setTheme, ThemeMode } from '../redux/slices/themeSlice';

export const useTheme = () => {
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector((state: RootState) => state.theme.mode);

  return {
    mode,
    isDark: mode === 'dark',
    toggleTheme: () => dispatch(toggleTheme()),
    setTheme: (theme: ThemeMode) => dispatch(setTheme(theme)),
  };
};
