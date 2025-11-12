import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const UnidadConversion = sequelize.define(
  "UnidadConversion",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    base: {
      type: DataTypes.STRING(50), // ejemplo: 'libra', 'litro', 'metro','docena','unidad','media docena'
      allowNull: false,
    },
    unidad: {
      type: DataTypes.STRING(50), // ejemplo: 'quintal', 'galon', 'yarda','kilogramo','pie','medio litro','un cuarto de litro','media libra',''
      allowNull: false,
    },
    factor: {
      type: DataTypes.DECIMAL(10, 6), // puede incluir decimales
      allowNull: false,
      comment:
        "Factor de conversión: cuántas unidades base equivalen a una de la unidad secundaria.",
    },
  },
  {
    tableName: "unidades_conversion",
    timestamps: false,
    indexes: [{ fields: ["base", "unidad"] }],
  }
);

export default UnidadConversion;
