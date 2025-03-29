import fs from "fs";
import swaggerJSDoc, { OAS3Options } from "swagger-jsdoc";
import yaml from "yaml";

import { config } from "@/shared/utils/config";

const swaggerDocument = yaml.parse(fs.readFileSync(config.environments.default.api.swagger.local, "utf8"));
const swaggerOptions: OAS3Options = {
  definition: swaggerDocument as OAS3Options["definition"],
  apis: [],
};

export default swaggerJSDoc(swaggerOptions);
