import React from 'react'

export const KeyValueTable = ({headers, data, colors}) => {
  // TODO: use an actual table component
  return (
    <table style={{borderCollapse: "collapse", margin: "0 auto 10px auto"}}>
      <thead>
      <tr>{headers.map(h => <th key={h} style={{border: "1px solid black", padding: "12px"}}>{h}</th>)}</tr>
      </thead>
      <tbody style={{textAlign: "center"}}>
      {Object.keys(data)
        .sort((a, b) => data[b] - data[a])
        .map(key => (
          <tr style={{color: colors[key]}}>
            <td style={{border: "1px solid black", padding: "12px"}}>{key}</td>
            <td style={{border: "1px solid black", padding: "12px"}}>{data[key]}</td>
          </tr>
        )
      )}
      </tbody>
    </table>
  )
};
