import Link from 'next/link';
import V1Layout, { V1_SECTIONS } from '../../components/v1/V1Layout';

export default function V1Home() {
  return (
    <V1Layout breadcrumb="~">
      <table className="v1-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Section</th>
            <th className="v1-numeric">Items</th>
          </tr>
        </thead>
        <tbody>
          {V1_SECTIONS.map((section, i) => (
            <tr key={section.href} className={i % 2 === 0 ? 'v1-row-even' : 'v1-row-odd'}>
              <td>{section.label}</td>
              <td>
                <Link href={section.href}>{section.href}</Link>
              </td>
              <td className="v1-numeric">{section.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .v1-table {
          width: 100%;
          border-collapse: collapse;
        }

        .v1-table th,
        .v1-table td {
          text-align: left;
          padding: 6px 10px;
          height: 34px;
          border-bottom: 1px solid #1c2022;
        }

        .v1-table th {
          font-weight: 700;
          color: #6ee7b7;
        }

        .v1-numeric {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .v1-row-even {
          background: #101314;
        }

        .v1-row-odd {
          background: #0d0f10;
        }

        .v1-table tr:hover {
          background: #1c2022;
        }

        .v1-table a {
          color: #d8dcdd;
          text-decoration: none;
        }
      `}</style>
    </V1Layout>
  );
}
