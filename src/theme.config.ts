export const themeConfig = {
    themes: {
        red: {
            color1: '#EF5350',
            color2: '#E57373',
            color3: '#EF9A9A',
            color4: '#F44336',
            color5: '#E53935',
        },
        pink: {
            color1: '#EC407A',
            color2: '#F06292',
            color3: '#F48FB1',
            color4: '#E91E63',
            color5: '#D81B60',
        },
        blue: {
            color1: '#42A5F5',
            color2: '#64B5F6',
            color3: '#90CAF9',
            color4: '#2196F3',
            color5: '#1E88E5',
        },
        green: {
            color1: '#388E3C',
            color2: '#43A047',
            color3: '#4CAF50',
            color4: '#66BB6A',
            color5: '#81C784',
        },
        yellow: {
            color1: '#FBC02D',
            color2: '#FDD835',
            color3: '#FFEB3B',
            color4: '#FFEE58',
            color5: '#FFF176',
        },
        orange: {
            color1: '#FFA726',
            color2: '#FFB74D',
            color3: '#FFCC80',
            color4: '#FF9800',
            color5: '#FB8C00',
        },
        
      },
      getThemeColors: (themeName: string) => {
        const theme = themeConfig.themes[themeName];
        return Object.keys(theme).map(key => theme[key]);
      }
};