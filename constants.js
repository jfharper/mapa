// JavaScript Document
const seznamTras = [
        {
          url: "/20090801-04%20-%20Sumava%20%28Antygl%20-%20Zaton%29.xml",
          barva: this.petBarev,
        },
        { url: "/20120616-18%20-%20Sazava%20%28Sobesin%20-%20Pikovice%29.xml" },
        {
          url: "/20120812-14%20-%20Beskydy%20%28Frenstat%20-%20Bila%29.xml",
          barva: this.triBarvy,
        },
        { url: "/20130523-26%20-%20Nova%20Pec%2C%20Plechy%2C%20Vltava.xml" },
      ];
 const barvy = {
        modra: "#004c8c",
        oranzova: "#ff9b11",
        zluta: "#ffd625",
        fialova: "#840026",
        svetlemodra: "#89cdff",
        fialova2: "#522476",
        cervena: "#ff0000",
        cervena2: "#c9000e",
        svetlemodra2: "#008ad4",
        seda: "#303030",
        ruzova: "#bb6060",
        zelena: "#44f144",
      };
			
 const barvyDefault = [
        barvy.modra,
        barvy.zluta,
        barvy.cervena,
        barvy.svetlemodra,
        barvy.fialova,
        barvy.oranzova,
        barvy.fialova2,
        barvy.cervena2,
        barvy.svetlemodra2,
        barvy.seda,
        barvy.ruzova,
      ];
      const petBarev = [
        barvy.fialova,
        barvy.zelena,
        barvy.seda,
        barvy.cervena2,
        barvy.ruzova,
      ];
      const triBarvy = [barvy.oranzova, barvy.svetlemodra2, barvy.fialova2];     
export {seznamTras, barvyDefault, petBarev, triBarvy}