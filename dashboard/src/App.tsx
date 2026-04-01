import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import WordHeatmap from './pages/WordHeatmap';
import LexiconList from './pages/LexiconList';
import WordDetail from './pages/WordDetail';
import QueryInterface from './pages/QueryInterface';
import EtymologyMap from './pages/EtymologyMap';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<WordHeatmap />} />
          <Route path="/lexicon" element={<LexiconList />} />
          <Route path="/word/:word" element={<WordDetail />} />
          <Route path="/query" element={<QueryInterface />} />
          <Route path="/etymology" element={<EtymologyMap />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
