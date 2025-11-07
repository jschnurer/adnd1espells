import { useEffect, useState } from 'react'
import './App.css'
import spells from "./data/spells.json";

function App() {
  const [selectedClass, setSelectedClass] = useState<string | null>("Cleric");
  const [selectedSourceNames, setSelectedSourceNames] = useState<string[]>(["Players HB"]);
  const [selectedSpell, setSelectedSpell] = useState<ISpell | null>(null);

  const sourceList = spells
    .map(spell => ({ source: spell.source.split("-")[0].trim(), page: spell.source.split("-")[1]?.trim() }))
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => a.source.localeCompare(b.source));

  const sourceNames = sourceList.map(x => x.source)
    .filter((value, index, self) => self.indexOf(value) === index);

  const classList = spells.map(x => x.classLevels.reduce((acc, curr) => {
    if (!acc.includes(curr.className)) {
      acc.push(curr.className);
    }
    return acc;
  }, [] as string[])).flat().filter((value, index, self) => self.indexOf(value) === index);

  const sortedFilteredSpells = spells
    .filter(spell =>
      (selectedClass ? spell.classLevels.some(cl => cl.className === selectedClass) : true) &&
      selectedSourceNames.includes(spell.source.split("-")[0].trim())
    )
    .sort((a, b) => {
      if (a.classLevels[0].level !== b.classLevels[0].level) {
        return a.classLevels[0].level - b.classLevels[0].level;
      } else {
        return a.name.localeCompare(b.name)
      }
    });

  const spellLevels = sortedFilteredSpells
    .map(spell => spell.classLevels.find(cl => cl.className === selectedClass!)?.level ?? 0)
    .filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b);

  useEffect(() => {
    if (selectedSpell) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
  }, [selectedSpell]);

  return (
    <>
      <div className="controls">
        <label>
          <b>Class: </b>
          <select value={selectedClass ?? ""} onChange={e => setSelectedClass(e.target.value || null)}>
            {classList.slice().sort((a, b) => a.localeCompare(b)).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <div>
          <b>Sources: </b>
          {sourceNames.map(name => (
            <label key={name} style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={selectedSourceNames.includes(name)}
                onChange={e =>
                  setSelectedSourceNames(prev =>
                    e.target.checked
                      ? (prev.includes(name) ? prev : [...prev, name])
                      : prev.filter(n => n !== name)
                  )
                }
              />
              {" "}{name}
            </label>
          ))}
        </div>
      </div>
      <hr />
      <div className="spell-list">
        {spellLevels.map(level => (
          <div key={level}>
            <h3>Level {level}</h3>
            {sortedFilteredSpells
              .filter(spell => (spell.classLevels.find(cl => cl.className === selectedClass!)?.level ?? 0) === level)
              .map(spell => (
                <div key={spell.name} className="spell-card">
                  <span className="clickable-spell"
                    onClick={() => setSelectedSpell(spell)}
                  >
                    {spell.name}{spell.reversible ? "*" : ""}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>

      {selectedSpell &&
        <div className="spell-popup-backdrop" onClick={() => setSelectedSpell(null)}>
          <div className="spell-popup-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedSpell(null)}>X</button>
            {renderSpellDetails(selectedSpell)}
          </div>
        </div>
      }
    </>
  )
}

export default App

function renderSpellDetails(spell: ISpell) {
  return (
    <div className="spell-details">
      <h2>{spell.name}{spell.reversible ? "*" : ""}</h2>
      {spell.reversible && <p><i>* Reversible Spell</i></p>}

      <p><b>Level:</b> {spell.classLevels[0].level}</p>
      <p><b>School:</b> {spell.school}</p>
      <p><b>Components:</b> {spell.components.join(", ")}</p>
      <p><b>Casting Time:</b> {spell.castingTime}</p>
      <p><b>Range:</b> {spell.range}</p>
      <p><b>Duration:</b> {spell.duration}</p>
      <p><b>Area of Effect:</b> {spell.areaOfEffect}</p>

      <hr />

      <div style={{ whiteSpace: "pre-wrap" }}>
        {spell.description.map((desc, dix) => {
          if (typeof desc === "string") {
            return <p key={dix}>{desc}</p>;
          } else if (Object.hasOwn(desc, "headers") && Object.hasOwn(desc, "rows")) {
            let numCols = desc.headers.length;

            return (
              <table style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {desc.headers.map((h, hix) => <th key={hix} style={{ textAlign: "left", border: "1px silver solid" }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {desc.rows.map((rowCells, rix) =>
                    <tr key={rix}>
                      {rowCells.map((c, cix) => <td key={cix} style={{ textAlign: "left", border: "1px silver solid" }}>{c.trim() ?? <>&nbsp;</>}</td>)}

                      {numCols > rowCells.length &&
                        [...new Array(numCols - rowCells.length)].map((_, acix) =>
                          <td key={acix} style={{ textAlign: "left", border: "1px silver solid" }}>&nbsp;</td>
                        )}
                    </tr>
                  )}
                </tbody>
              </table>
            );
          }
        })
        }
      </div>

      {spell.source &&
        <div className="spell-popup-footer">
          <p><i>{spell.source}</i></p>
        </div>
      }
    </div>
  )
}

interface ISpell {
  name: string;
  reversible?: boolean;
  school: string;
  source: string;
  components: string[];
  castingTime: string;
  range: string;
  duration: string;
  areaOfEffect: string;
  savingThrow: string;
  description: (string | {
    headers: string[];
    rows: string[][];
  })[];
  classLevels: {
    className: string;
    level: number;
  }[];
}