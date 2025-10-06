import { NextResponse } from "next/server";

export async function CreatedMessage(message: string, data: object) {
  return NextResponse.json({ message: message, data: data }, { status: 201 }); // Created
}

export async function SuccessMessage(message: string, data: object) {
  return NextResponse.json({ message: message, data: data }, { status: 200 }); // OK
}

export async function NoContentMessage(message: string = "No Content") {
  return NextResponse.json({ status: 204 }); // No Content
}

export async function DeleteMessage() {
  return NextResponse.json({ status: 204 }); // No content
}

export async function InternalServerErrorMessage(message: string = "Internal Server Error") {
  return NextResponse.json({ message: message }, { status: 500 }); // Internal Server Error
}

export async function BadRequestMessage(message: string = "Bad Request") {
  return NextResponse.json({ message: message }, { status: 400 }); // Bad Request
}

export async function NotFoundMessage(message: string = "Requested Resource was not found") {
  return NextResponse.json({ message: message }, { status: 404 }); // Not Found
}

/**
 * Author: zsil
 * https://github.com/prisma/prisma/discussions/2414
 * @param {{[String]: any} | {[String]: any}[]} queryResult
 * @param {{[String]: any}} include
 * @param {String?} parentKey
 */
const flattenPrismaIncludeResult = (queryResult, includeObj, parentKey = null) => {
  if (!queryResult) return queryResult;
  const qrIsArray = Array.isArray(queryResult);
  const includeObjKeys = Object.keys(includeObj);
  if (!qrIsArray) {
    // handle everything as an array, then transform at the end
    queryResult = [queryResult];
  }

  const newResultSet = [];
  for (let qri of queryResult) {
    for (const incKey of includeObjKeys) {
      const typeofIncValue = typeof includeObj[incKey];
      const typeofQriValue = typeof qri[incKey];
      if (typeofIncValue === "object") {
        // DFS
        if (incKey === "include") {
          let res = { ...qri, ...flattenPrismaIncludeResult(qri, includeObj[incKey], parentKey) };
          if (res.__deleteKey) {
            delete res[res.__deleteKey];
            delete res.__deleteKey;
          }
          newResultSet.push(res);
        } else {
          qri[incKey] = flattenPrismaIncludeResult(qri[incKey], includeObj[incKey], incKey);
          if (typeofQriValue === "object" && !Array.isArray(qri[incKey]) && !!parentKey) {
            qri = { ...qri, ...qri[incKey], __deleteKey: incKey };
            delete qri[incKey];
          }
          newResultSet.push(qri);
        }
      } else if (typeofIncValue === "boolean" && qri.hasOwnProperty(incKey) && parentKey !== null) {
        const tmpObj = { ...qri, ...qri[incKey], __deleteKey: incKey };
        delete tmpObj[incKey];
        newResultSet.push(tmpObj);
      } else {
        // TODO - confirm that we don't need to handle this case
        newResultSet.push(qri);
      }
    }
  }

  const result = qrIsArray ? newResultSet : newResultSet[0];
  return result;
};
